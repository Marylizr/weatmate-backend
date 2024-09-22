const { Configuration, OpenAIApi } = require('openai');
const ChatUser = require('../models/chatUser');


const configuration = new Configuration({
  organization: "",
  apiKey:'',
});


exports.chatCompletion = async (req, res) => {
  try {
    const { prompt } = req.body;

    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", 
        "content": "You are a helpful assistant."
      }, 
      {
        role: "user", 
        content: `${prompt}`,
    },

    ],
      max_tokens: 150,
    });
    const response = completion.data.choices[0].message.content;
    res.send(response);
    
    console.log(completion.data.choices[0].message);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred')
    
  }
  console.log(configuration);
 
}

exports.findAll = async (req, res) =>{
  res.status(200).json(await ChatUser.find());
};


exports.create = async (req, res) => {
  const data = req.body;
  const dataPosted = {
      userName:data.userName,
      content: data.content,
      infotype: data.infotype,
      picture: data.picture,
      date: Date.now()
  }
  
  const newChat = new ChatUser(dataPosted); 
  
  await newChat.save(); 
  console.log(newChat, 'Your new chat prompt has been created'); 
  res.json( newChat );
};
